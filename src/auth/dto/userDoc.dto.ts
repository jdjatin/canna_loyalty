import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class DocType {

    @IsOptional()
    front_pic: Express.Multer.File[];
  
    @IsOptional()
    back_pic: Express.Multer.File[];

    @IsNotEmpty()
    @ApiProperty({example:"Driving License"})
    document_type:string;

}