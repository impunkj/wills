import { IsArray, IsEmail, IsOptional, IsString, Length } from 'class-validator'

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  accountId?: string

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
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  @Length(1, 120)
  wealthManagerId?: string
}
