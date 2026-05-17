import { Type } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, Length, ValidateIf, ValidateNested } from 'class-validator'

class WealthManagerPayloadDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  wealthManagerId!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 160)
  wealthManagerName!: string
}

class TaxContextPayloadDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  sellerState!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  customerState!: string
}

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 160)
  name!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 40)
  phone!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 160)
  email!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  source!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 160)
  serviceInterest!: string

  @ValidateIf((object) => !object.wealthManager)
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  wealthManagerId?: string

  @IsOptional()
  @IsString()
  @Length(1, 160)
  wealthManagerName?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => WealthManagerPayloadDto)
  wealthManager?: WealthManagerPayloadDto

  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  assignedEmployee!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  leadType!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 240)
  address!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  city!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  state!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 12)
  pinCode!: string

  @IsOptional()
  @IsString()
  @Length(0, 160)
  company?: string

  @IsOptional()
  @IsString()
  @Length(0, 120)
  designation?: string

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string

  @IsOptional()
  @IsString()
  @Length(1, 120)
  assignedAgentId?: string

  @IsOptional()
  @IsString()
  @Length(1, 60)
  status?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => TaxContextPayloadDto)
  taxContext?: TaxContextPayloadDto
}
