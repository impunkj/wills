import { Type } from 'class-transformer'
import { IsBoolean, IsDate, IsOptional } from 'class-validator'

export class ReportQueryDto {
  @Type(() => Date)
  @IsDate()
  from!: Date

  @Type(() => Date)
  @IsDate()
  to!: Date

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  comparePrevious?: boolean
}
