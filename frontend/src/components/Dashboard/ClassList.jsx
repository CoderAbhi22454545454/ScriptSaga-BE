import React from "react";
import { Button } from "../ui/button";

const ClassList = ({ classes, onClassClick }) => {
    return (
        <div className="py-3">
            <h2 className="text-2xl pb-5">Classes</h2>
            {classes.map((cls) => (
                <div className='grid grid-cols-4' key={cls._id} >
                    <div key={cls._id} onClick={() => onClassClick(cls._id)} className='cursor-pointer border-solid border-2   rounded-md'>
                        <div className='flex gap-2 bg-emerald-500 p-3 '>
                            <h3>Class : </h3>
                            {cls.yearOfStudy}
                        </div>
                        <div className='p-3'>
                            <h3>Branch </h3>
                            {cls.branch}
                        </div>
                        <div className='p-3'>
                            <h3>Division </h3>
                            {cls.division}
                        </div>
                        <p>Clas Studnets : {cls.studentCount}</p>

                    </div>
                </div>
            ))}
        </div>
    );
};
export default ClassList;
