import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { LeadInputDto } from './common.dto'

const IMPORT_SOURCE_FORMATS = ['csv', 'xlsx'] as const

export class ImportLeadsDto {
  @IsEnum(IMPORT_SOURCE_FORMATS)
  sourceFormat!: (typeof IMPORT_SOURCE_FORMATS)[number]

  @IsOptional()
  @IsString()
  originalFileName?: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LeadInputDto)
  records!: LeadInputDto[]
}
