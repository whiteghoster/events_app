import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('Contractors')
export class ContractorsController {
  constructor(private readonly ContractorsService: ContractorsService) {}

  @Public()
  @Get()
  async findAll() {
    return await this.ContractorsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateContractorDto) {
    return await this.ContractorsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateContractorDto) {
    return await this.ContractorsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.ContractorsService.delete(id);
  }

  @Public()
  @Get(':id/events')
  async findContractorEvents(@Param('id') id: string) {
    const data = await this.ContractorsService.findEventsByContractor(id);
    return { data };
  }
}
