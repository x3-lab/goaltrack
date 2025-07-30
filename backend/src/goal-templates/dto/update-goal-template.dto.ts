import { PartialType } from '@nestjs/mapped-types';
import { CreateGoalTemplateDto } from './create-goal-template.dto';

export class UpdateGoalTemplateDto extends PartialType(CreateGoalTemplateDto) {}