import React from "react";
import { Button } from "../ui/button";

const ClassList = ({ classes, onClassClick }) => {
    return (
        <div>
            <h2>Classes</h2>
            {classes.map((cls) => (
                <Button key={cls._id} onClick={() => onClassClick(cls._id)}>
                    {cls.yearOfStudy} {cls.branch} {cls.division}
                </Button>
            ))}
        </div>
    );
};

export default ClassList;
