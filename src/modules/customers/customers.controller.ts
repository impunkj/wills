import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { CustomersService } from './customers.service'

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query() filters?: Record<string, unknown>) {
    return this.customersService.findAll(filters)
  }

  @Get('list')
  getCustomerList() {
    return this.customersService.findAll({})
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id)
  }

  @Post()
  create(@Body() body: CreateCustomerDto) {
    return this.customersService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.customersService.update(id, body)
  }

  @Get(':id/tabs/:tab')
  getTab(
    @Param('id') customerId: string,
    @Param('tab') tab: 'overview' | 'cases' | 'quotations' | 'invoices' | 'documents' | 'activity',
  ) {
    return this.customersService.getTab(customerId, tab)
  }
}
