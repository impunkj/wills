import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
