import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AccountsService } from './accounts.service'
import { CreateAccountDto } from './dto/create-account.dto'
import { CreateCreditNoteDto } from './dto/create-credit-note.dto'
import { RecordPaymentDto } from './dto/record-payment.dto'
import { UpdateAccountDto } from './dto/update-account.dto'

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(@Query() filters?: Record<string, unknown>) {
    return this.accountsService.findAll(filters)
  }

  @Get('list')
  getAccountList() {
    return this.accountsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id)
  }

  @Post()
  create(@Body() body: CreateAccountDto) {
    return this.accountsService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAccountDto) {
    return this.accountsService.update(id, body)
  }

  @Post('invoices/:invoiceId/payments')
  recordPayment(@Param('invoiceId') invoiceId: string, @Body() body: RecordPaymentDto) {
    return this.accountsService.recordPayment(invoiceId, body.amount, body.recordedBy)
  }

  @Post('leads/:leadId/convert')
  convertFromLead(@Param('leadId') leadId: string) {
    return this.accountsService.convertFromLead(leadId)
  }

  @Post('invoices/:invoiceId/credit-notes')
  createCreditNote(
    @Param('invoiceId') invoiceId: string,
    @Body() body: CreateCreditNoteDto,
  ) {
    return this.accountsService.createCreditNote(invoiceId, body)
  }

  @Post('credit-notes/:creditNoteId/approve-refund')
  approveRefund(
    @Param('creditNoteId') creditNoteId: string,
    @Body() body: { approvedBy: string },
  ) {
    return this.accountsService.approveRefund(creditNoteId, body.approvedBy)
  }
}
