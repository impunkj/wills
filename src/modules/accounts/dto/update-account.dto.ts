import { IsOptional, IsString } from 'class-validator'

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  gstType?: string

  @IsOptional()
  @IsString()
  wealthManagerId?: string
}
