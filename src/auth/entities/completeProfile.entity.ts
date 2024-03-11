import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, Unique } from "typeorm";

@Entity({ name:'user_profile' })

export class CompleteProfile {
    @PrimaryGeneratedColumn('uuid')
    id: number;
  
    @Column({name:'user_id'})
    userId: string;
  
    @Column({nullable:true,name:'Date Of Birth'})
    DOB: string;

    @Column({nullable:true})
    PhoneNumber: string;

    @Column({default:false})
    isEligible:boolean;
  
    @CreateDateColumn({ name: 'created_at' }) 'created_at': Date;
    
    @UpdateDateColumn({ name: 'updated_at' }) 'updated_at': Date;
  
  }
