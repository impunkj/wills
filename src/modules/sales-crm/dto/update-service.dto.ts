import { PartialType } from '@nestjs/mapped-types'
import { ServiceCatalogInputDto } from './common.dto'

export class UpdateServiceDto extends PartialType(ServiceCatalogInputDto) {}
