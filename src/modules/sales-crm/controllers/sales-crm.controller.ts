import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApproveQuotationDto,
  AssignLeadToAccountsDto,
  CreateFollowUpDto,
  CreateLeadDto,
  CreateQuotationDto,
  CreateServiceDto,
  ExportLeadsQueryDto,
  ListLeadsQueryDto,
  SendQuotationDto,
  UpdateLeadDto,
  UpdateServiceDto,
} from '../dto'
import { SalesCrmService } from '../services/sales-crm.service'

type AuthenticatedRequest = {
  user?: {
    role?: string
    roles?: string[]
  }
}

@Controller('sales-crm')
@UseGuards(AuthGuard('jwt'))
export class SalesCrmController {
  constructor(private readonly salesCrmService: SalesCrmService) {}

  @Get('leads/status-counts')
  getStatusCounts() {
    return this.salesCrmService.getStatusCounts()
  }

  @Get('leads/export')
  exportLeads(@Query() query: ExportLeadsQueryDto) {
    return this.salesCrmService.bulkExport(query)
  }

  @Get('leads')
  getLeads(@Query() query: ListLeadsQueryDto) {
    return this.salesCrmService.findAll(query)
  }

  @Get('leads/:id')
  getLead(@Param('id') id: string) {
    return this.salesCrmService.findOne(id)
  }

  @Post('leads')
  createLead(@Body() body: CreateLeadDto) {
    return this.salesCrmService.create(body)
  }

  @Patch('leads/:id')
  updateLead(
    @Param('id') id: string,
    @Body() body: UpdateLeadDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (body.assignedAgentId !== undefined) {
      this.assertAdmin(request.user)
    }

    return this.salesCrmService.update(id, body)
  }

  @Delete('leads/:id')
  removeLead(@Param('id') id: string) {
    return this.salesCrmService.remove(id)
  }

  @Post('leads/import')
  importLeads(@Body() body: { records: CreateLeadDto[] }) {
    return this.salesCrmService.bulkImport(body)
  }

  @Post('leads/:id/follow-ups')
  addFollowUp(@Param('id') id: string, @Body() body: CreateFollowUpDto) {
    return this.salesCrmService.addFollowUp(id, body)
  }

  @Post('leads/:id/quotations')
  createQuotation(@Param('id') id: string, @Body() body: CreateQuotationDto) {
    return this.salesCrmService.createQuotation(id, body)
  }

  @Post('quotations/:id/send')
  sendQuotation(@Param('id') id: string, @Body() body: SendQuotationDto) {
    return this.salesCrmService.sendQuotation(id, body.via)
  }

  @Post('quotations/:id/approve')
  approveCustomQuotation(
    @Param('id') id: string,
    @Body() body: ApproveQuotationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertAdmin(request.user)
    return this.salesCrmService.approveCustomQuotation(id, body)
  }

  @Post('leads/:id/assign-to-account')
  assignToAccount(
    @Param('id') id: string,
    @Body() body: AssignLeadToAccountsDto,
  ) {
    return this.salesCrmService.assignToAccount(id, body)
  }

  @Post('services')
  createService(@Body() body: CreateServiceDto) {
    return this.salesCrmService.createService(body)
  }

  @Patch('services/:id')
  updateService(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.salesCrmService.updateService(id, body)
  }

  private assertAdmin(user?: { role?: string; roles?: string[] }) {
    const role = user?.role ?? user?.roles?.[0]
    if (role !== 'Admin' && role !== 'ADMIN') {
      throw new ForbiddenException('Only Admin can perform this Sales CRM action')
    }
  }
}
