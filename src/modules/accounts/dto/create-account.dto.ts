import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator'

const GST_TYPES = ['IGST', 'CGST_SGST', 'EXEMPT'] as const

export class CreateAccountDto {
  @IsString()
  @Length(1, 160)
  name!: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @Length(1, 40)
  phone?: string

  @IsOptional()
  @IsString()
  @Length(1, 100)
  state?: string

  @IsOptional()
  @IsString()
  @Length(1, 120)
  wealthManagerId?: string

  @IsOptional()
  @IsEnum(GST_TYPES)
  gstType?: (typeof GST_TYPES)[number]

  @IsOptional()
  @IsString()
  @Length(1, 120)
  convertedFromId?: string
}
