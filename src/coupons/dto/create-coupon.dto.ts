import { IsDateString, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty({ message: 'El nombre del cupón es obligatorio' })
  name: string;

  @IsNotEmpty({ message: 'El descuento no puede ir vacio' })
  @IsInt({ message: 'El descuento debe de ser entre 1 y 100' })
  @Max(100, { message: 'El descuento máximo es de 100' })
  @Min(1, { message: 'El descuento mínimo es de 1' })
  percentaje: number;

  @IsNotEmpty({ message: 'La fecha de expiración es obligatoria' })
  @IsDateString(
    {},
    { message: 'La fecha de expiración debe ser una fecha válida' },
  )
  expirationDate: Date;
}
