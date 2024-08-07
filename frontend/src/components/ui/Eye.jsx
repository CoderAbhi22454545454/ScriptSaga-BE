import React from 'react';
import { IoMdEye } from "react-icons/io";
import { IoIosEyeOff } from "react-icons/io";

const Eye = ({ isVisible, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-0 bottom-2 pr-3 flex items-center text-gray-500"
    >
      {isVisible ? (
        <IoMdEye className="w-5 h-5 slate-950" />
      ) : (
        <IoIosEyeOff className="w-5 h-5 slate-950" />
      )}
    </button>
  );
};

export default Eye;
