import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
// import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Transaction,
  TransactionContents,
} from './entities/transaction.entity';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { CouponsService } from '../coupons/coupons.service';
@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionContents)
    private readonly transactionContentsRepository: Repository<TransactionContents>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly CouponService: CouponsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    try {
      await this.productRepository.manager.transaction(
        async (transactionEntityManager) => {
          const transaction = new Transaction();
          const total = createTransactionDto.contents.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          transaction.total = total;

          if (createTransactionDto.coupon) {
            const coupon = await this.CouponService.applyCoupon(
              createTransactionDto.coupon,
            );
            const discount = (coupon.percentaje / 100) * total;
            transaction.discount = discount;
            transaction.coupon = coupon.name;
            transaction.total -= discount;
          }

          await transactionEntityManager.save(transaction);

          for (const contents of createTransactionDto.contents) {
            const product = await transactionEntityManager.findOneBy(Product, {
              id: contents.productId,
            });

            if (!product) {
              throw new NotFoundException([
                `El producto con el ID: ${contents.productId} no existe`,
              ]);
            }

            if (product.inventory < contents.quantity) {
              throw new BadRequestException([
                `El producto ${product.name} excede el inventario disponible`,
              ]);
            }

            product.inventory -= contents.quantity;

            const transactionContents = new TransactionContents();
            transactionContents.price = contents.price;
            transactionContents.product = product;
            transactionContents.quantity = contents.quantity;
            transactionContents.transaction = transaction;

            await transactionEntityManager.save(transactionContents);
            await transactionEntityManager.save(product);
          }
        },
      );

      return { message: 'Venta realizada correctamente' };
    } catch (error: unknown) {
      this.logger.error(
        'Error en create():',
        error instanceof Error ? error.stack : String(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException([
        'Error al realizar la transacción',
      ]);
    }
  }

  findAll(transactionDate?: string) {
    const options: FindManyOptions<Transaction> = {
      relations: {
        contents: true,
      },
    };

    if (transactionDate) {
      const date = parseISO(transactionDate);
      if (!isValid(date)) {
        throw new BadRequestException(['Fecha inválida']);
      }
      const dateStar = startOfDay(date);
      const dateEnd = endOfDay(date);
      options.where = {
        transactionDate: Between(dateStar, dateEnd),
      };
    }
    return this.transactionRepository.find(options);
  }

  async findOne(id: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: {
        contents: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transacción no encontrada`);
    }
    return transaction;
  }

  // update(id: number, updateTransactionDto: UpdateTransactionDto) {
  //   return `This action updates a #${id} transaction`;
  // }

  async remove(id: number) {
    const transaction = await this.findOne(id);
    for (const contents of transaction.contents) {
      const product = await this.productRepository.findOneBy({
        id: contents.product.id,
      });
      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${contents.product.id} no encontrado`,
        );
      }
      product.inventory += contents.quantity;
      await this.productRepository.save(product);

      const transactionContents =
        await this.transactionContentsRepository.findOneBy({ id: contents.id });
      if (transactionContents) {
        await this.transactionContentsRepository.remove(transactionContents);
      }
    }
    return {
      message: 'Venta eliminada correctamente',
    };
  }
}
