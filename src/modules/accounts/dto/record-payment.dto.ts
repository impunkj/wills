import { Type } from 'class-transformer'
import { IsNumber, IsString, Length, Min } from 'class-validator'

export class RecordPaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number

  @IsString()
  @Length(1, 120)
  recordedBy!: string
}
