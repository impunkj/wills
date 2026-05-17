import { IsEnum, IsOptional } from 'class-validator'
import { LeadFilterQueryDto } from './common.dto'

const EXPORT_FORMATS = ['csv', 'xlsx'] as const

export class ExportLeadsQueryDto extends LeadFilterQueryDto {
  @IsOptional()
  @IsEnum(EXPORT_FORMATS)
  format?: (typeof EXPORT_FORMATS)[number]
}
