import { Type } from 'class-transformer'
import { IsDate, IsString, Length } from 'class-validator'

export class AddFollowUpDto {
  @IsString()
  @Length(1, 240)
  action!: string

  @IsString()
  @Length(1, 160)
  serviceType!: string

  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date
}
