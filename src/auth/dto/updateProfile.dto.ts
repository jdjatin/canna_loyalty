import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateProfileDto {
    
    @IsOptional()
    // @IsDateString()
    @ApiPropertyOptional({ format: 'dd-mm-yyy', example: '15-03-2023' })
    DOB?: string;

    @IsOptional()
    @ApiPropertyOptional()
    phoneNumber?:string;
}
