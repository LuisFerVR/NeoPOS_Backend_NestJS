import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El nombre del producto es obligatoria' })
  name: string;

  @IsNotEmpty({ message: 'El precio del producto es obligatoria' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio del producto debe ser un número' },
  )
  price: number;

  @IsNotEmpty({ message: 'La cantidad no puede ir vacia' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Cantidad no válida' })
  inventory: number;

  @IsNotEmpty({ message: 'La categoria es obligatoria' })
  @IsInt({ message: 'La categoria no es válida' })
  categoryId: number;
}
