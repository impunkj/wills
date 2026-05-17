import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class UpdatePartnerDto {
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
  @IsBoolean()
  isActive?: boolean
}
