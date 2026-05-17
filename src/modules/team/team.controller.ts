import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { CreateTeamMemberDto } from './dto/create-team-member.dto'
import { UpdateTeamMemberDto } from './dto/update-team-member.dto'
import { TeamService } from './team.service'

@Controller('team')
@UseGuards(AuthGuard('jwt'))
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.teamService.findAll(includeInactive === 'true')
  }

  @Get('wealth-managers')
  getWealthManagers() {
    return this.teamService.getWealthManagers()
  }

  @Get('employees')
  getEmployees() {
    return this.teamService.getEmployees()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamService.findOne(id)
  }

  @Post()
  create(@Body() body: CreateTeamMemberDto) {
    return this.teamService.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTeamMemberDto) {
    return this.teamService.update(id, body)
  }

  @Post(':id/soft-delete')
  softDelete(@Param('id') id: string, @Body() body?: { hardDelete?: boolean }) {
    return this.teamService.softDelete(id, body?.hardDelete)
  }

  @Patch(':id/kyc')
  updateKYC(
    @Param('id') id: string,
    @Body() body: { status: TeamKycStatus; documents?: unknown },
  ) {
    return this.teamService.updateKYC(id, body.status, body.documents)
  }

  @Get('permission-matrix/all')
  getPermissionMatrix() {
    return this.teamService.getPermissionMatrix()
  }

  @Patch('lawyers/:lawyerId/availability')
  setAvailability(
    @Param('lawyerId') lawyerId: string,
    @Body() body: { isAvailable: boolean },
  ) {
    return this.teamService.setAvailability(lawyerId, body.isAvailable)
  }
}

type TeamKycStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED'
