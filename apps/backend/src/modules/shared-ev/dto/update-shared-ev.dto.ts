import { PartialType } from '@nestjs/mapped-types';
import { CreateSharedEvDto } from './create-shared-ev.dto.js';

export class UpdateSharedEvDto extends PartialType(CreateSharedEvDto) {}
