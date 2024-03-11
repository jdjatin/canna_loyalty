import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty } from "class-validator";

export class completeProfileDto {
    


    @IsNotEmpty()
    @ApiProperty({format: 'dd-mm-yyy', example: '15-03-2023'})
    DOB:string;


    @ApiProperty()
    phoneNumber:string;


}