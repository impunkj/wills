import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { CreateLawyerDto } from './dto/create-lawyer.dto'
import { UpdateLawyerDto } from './dto/update-lawyer.dto'
import { LawyersService } from './lawyers.service'

@Controller('lawyers')
@UseGuards(AuthGuard('jwt'))
export class LawyersController {
  constructor(private readonly lawyersService: LawyersService) {}

  @Get()
  findAll(@Query() filters?: Record<string, unknown>) {
    return this.lawyersService.findAll(filters)
  }

  @Get('active')
  getActiveLawyers() {
    return this.lawyersService.findAll({ isActive: true })
  }

  @Get('dropdown')
  getForDropdown() {
    return this.lawyersService.findAll({ isActive: true })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lawyersService.findOne(id)
  }

  @Post()
  create(@Body() body: CreateLawyerDto) {
    return this.lawyersService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateLawyerDto) {
    return this.lawyersService.update(id, body)
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.lawyersService.deactivate(id)
  }

  @Get(':id/active-cases')
  getActiveCases(@Param('id') lawyerId: string) {
    return this.lawyersService.getActiveCases(lawyerId)
  }
}
