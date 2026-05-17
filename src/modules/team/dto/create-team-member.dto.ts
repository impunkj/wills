import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateTeamMemberDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userId?: string

  @IsString()
  @IsNotEmpty()
  role!: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  email?: string
}
