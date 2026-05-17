import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import {
  FOLLOW_UP_PRIORITIES,
  FOLLOW_UP_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_TYPES,
  QUOTATION_SENT_VIA_OPTIONS,
  SERVICE_CATEGORIES,
} from '../types/sales-crm.types'
import {
  IsW24CaseId,
  IsW24CustomerId,
  IsW24LeadId,
  IsW24QuotationReference,
} from '../validators/id-format.decorators'

export class LeadFilterQueryDto {
  @IsOptional()
  @IsEnum(LEAD_STATUSES)
  status?: (typeof LEAD_STATUSES)[number]

  @IsOptional()
  @IsEnum(LEAD_SOURCES)
  source?: (typeof LEAD_SOURCES)[number]

  @IsOptional()
  @IsString()
  @Length(1, 120)
  wealthManagerId?: string

  @IsOptional()
  @IsString()
  @Length(1, 120)
  assignedEmployee?: string

  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class LeadReferenceDto {
  @IsW24LeadId()
  leadId!: string
}

export class CustomerReferenceDto {
  @IsW24CustomerId()
  customerId!: string
}

export class CaseReferenceDto {
  @IsW24CaseId()
  caseId!: string
}

export class QuotationReferenceDto {
  @IsW24QuotationReference()
  referenceNumber!: string
}

export class QuotationItemDto {
  @IsString()
  @Length(1, 64)
  serviceId!: string

  @IsString()
  @Length(1, 160)
  serviceName!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number
}

export class ServiceCatalogInputDto {
  @IsEnum(SERVICE_CATEGORIES)
  category!: (typeof SERVICE_CATEGORIES)[number]

  @IsString()
  @Length(1, 160)
  name!: string

  @IsString()
  @Length(1, 1000)
  description!: string

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRate!: number

  @IsString()
  @Length(1, 80)
  estimatedTAT!: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  documentChecklist!: string[]

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class SendQuotationDto {
  @IsEnum(QUOTATION_SENT_VIA_OPTIONS)
  via!: (typeof QUOTATION_SENT_VIA_OPTIONS)[number]
}

export class ApproveQuotationDto {
  @IsString()
  @Length(1, 120)
  approvedBy!: string
}

export class FollowUpInputDto {
  @IsEnum(FOLLOW_UP_TYPES)
  type!: (typeof FOLLOW_UP_TYPES)[number]

  @IsString()
  @Length(1, 180)
  title!: string

  @IsString()
  @Length(1, 2000)
  notes!: string

  @IsString()
  @Length(1, 120)
  author!: string

  @IsEnum(FOLLOW_UP_PRIORITIES)
  priority!: (typeof FOLLOW_UP_PRIORITIES)[number]

  @IsOptional()
  @IsDateString()
  nextActionDate?: string | null

  @IsOptional()
  @IsDateString()
  meetingDate?: string

  @IsOptional()
  @IsString()
  @Length(1, 240)
  meetingLocation?: string

  @IsOptional()
  @IsW24QuotationReference()
  quotationRef?: string

  @IsOptional()
  @IsW24CaseId()
  caseId?: string
}

export class CreateQuotationDto {
  @IsW24LeadId()
  leadId!: string

  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  @IsArray()
  @ArrayMinSize(1)
  items!: QuotationItemDto[]

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRateOverride?: number

  @IsOptional()
  @IsString()
  @Length(1, 120)
  generatedBy?: string
}

export class AssignLeadToAccountsDto {
  @IsW24LeadId()
  leadId!: string

  @IsOptional()
  @IsW24CustomerId()
  customerId?: string

  @IsOptional()
  @IsW24CaseId()
  caseId?: string

  @IsOptional()
  @IsString()
  @Length(1, 500)
  handoffNotes?: string
}

export class WealthManagerTagDto {
  @IsString()
  @Length(1, 64)
  wealthManagerId!: string

  @IsString()
  @Length(1, 160)
  wealthManagerName!: string
}

export class TaxContextDto {
  @IsString()
  @Length(1, 100)
  sellerState!: string

  @IsString()
  @Length(1, 100)
  customerState!: string
}

export class LeadInputDto {
  @IsEnum(LEAD_SOURCES)
  source!: (typeof LEAD_SOURCES)[number]

  @IsString()
  @Length(1, 160)
  name!: string

  @IsPhoneNumber('IN')
  phone!: string

  @IsEmail()
  email!: string

  @IsString()
  @Length(1, 240)
  address!: string

  @IsString()
  @Length(1, 80)
  city!: string

  @IsString()
  @Length(1, 80)
  state!: string

  @IsString()
  @Matches(/^\d{6}$/, { message: 'pinCode must be a valid 6-digit Indian PIN code' })
  pinCode!: string

  @IsOptional()
  @IsString()
  @Length(0, 160)
  company?: string

  @IsOptional()
  @IsString()
  @Length(0, 120)
  designation?: string

  @IsString()
  @Length(1, 160)
  serviceInterest!: string

  @ValidateNested()
  @Type(() => WealthManagerTagDto)
  wealthManager!: WealthManagerTagDto

  @IsString()
  @Length(1, 120)
  assignedEmployee!: string

  @IsOptional()
  @IsString()
  @Length(1, 120)
  assignedAgentId?: string

  @IsEnum(LEAD_TYPES)
  leadType!: (typeof LEAD_TYPES)[number]

  @IsOptional()
  @IsEnum(LEAD_STATUSES)
  status?: (typeof LEAD_STATUSES)[number]

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => TaxContextDto)
  taxContext?: TaxContextDto
}
