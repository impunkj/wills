import { IsArray, IsEmail, IsOptional, IsString, Length } from 'class-validator'

export class CreateLawyerDto {
  @IsString()
  @Length(1, 160)
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @Length(1, 120)
  barNumber!: string

  @IsOptional()
  @IsString()
  @Length(1, 40)
  phone?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialization?: string[]

  @IsOptional()
  @IsString()
  @Length(1, 120)
  teamMemberId?: string
}
