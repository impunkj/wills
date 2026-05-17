import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AddFollowUpDto } from './dto/add-follow-up.dto'
import { CreateCaseDto } from './dto/create-case.dto'
import { UpdateCaseDto } from './dto/update-case.dto'
import { CasesService } from './cases.service'

@Controller('cases')
@UseGuards(AuthGuard('jwt'))
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  findAll(@Query() filters?: Record<string, unknown>) {
    return this.casesService.findAll(filters)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id)
  }

  @Post()
  create(@Body() body: CreateCaseDto) {
    return this.casesService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCaseDto) {
    return this.casesService.update(id, body)
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: CaseStatusValue }) {
    return this.casesService.updateStatus(id, body.status)
  }

  @Post(':id/reassign')
  reassign(@Param('id') caseId: string, @Body() body: { newLawyerId: string }) {
    return this.casesService.reassign(caseId, body.newLawyerId)
  }

  @Get(':id/follow-ups')
  getFollowUps(@Param('id') caseId: string) {
    return this.casesService.getFollowUps(caseId)
  }

  @Post(':id/follow-ups')
  addFollowUp(@Param('id') caseId: string, @Body() body: AddFollowUpDto) {
    return this.casesService.addFollowUp(caseId, body)
  }

  @Get('customers/:customerId/service-types')
  getServiceTypesByCustomer(@Param('customerId') customerId: string) {
    return this.casesService.getServiceTypesByCustomer(customerId)
  }
}

type CaseStatusValue = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
