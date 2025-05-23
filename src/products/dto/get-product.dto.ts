import { IsNumberString, IsOptional } from 'class-validator';

export class GetProductsQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'La categoria debe de ser un número' })
  category_id?: number;

  @IsOptional()
  @IsNumberString({}, { message: 'La cantidad debe de ser un número' })
  take: number;

  @IsOptional()
  @IsNumberString({}, { message: 'La cantidad debe de ser un número' })
  skip: number;
}
