import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator'

export class CreateCaseDto {
  @IsString()
  @Length(1, 200)
  title!: string

  @IsString()
  @Length(1, 160)
  serviceType!: string

  @IsString()
  @Length(1, 120)
  customerId!: string

  @IsOptional()
  @IsString()
  @Length(1, 120)
  assignedLawyerId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level?: number

  @IsOptional()
  @IsString()
  @Length(1, 120)
  partnerId?: string
}
