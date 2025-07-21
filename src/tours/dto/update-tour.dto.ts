// src/tours/dto/update-tour.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateTourDto } from './create-tour.dto';

export class UpdateTourDto extends PartialType(CreateTourDto) {}
