import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { CreatePartnerDto } from './dto/create-partner.dto'
import { UpdatePartnerDto } from './dto/update-partner.dto'
import { PartnersService } from './partners.service'

@Controller('partners')
@UseGuards(AuthGuard('jwt'))
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll(@Query() filters?: Record<string, unknown>) {
    return this.partnersService.findAll(filters)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id)
  }

  @Post()
  create(@Body() body: CreatePartnerDto) {
    return this.partnersService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdatePartnerDto) {
    return this.partnersService.update(id, body)
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.partnersService.toggleActive(id)
  }

  @Post(':id/consume-will')
  consumeWill(@Param('id') partnerId: string) {
    return this.partnersService.consumeWill(partnerId)
  }

  @Get(':id/wallet-history')
  getWalletHistory(@Param('id') partnerId: string) {
    return this.partnersService.getWalletHistory(partnerId)
  }

  @Get(':id/tabs/:tab')
  getTab(
    @Param('id') partnerId: string,
    @Param('tab') tab: 'overview' | 'packages' | 'leads' | 'wallet' | 'activity',
  ) {
    return this.partnersService.getTab(partnerId, tab)
  }

  @Post('expire-stale-packages')
  expireStalePackages() {
    return this.partnersService.expireStalePackages()
  }
}
