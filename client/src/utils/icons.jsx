// src/utils/icons.jsx
import {
    FaEye,
    FaHeart,
    FaRegHeart,
    FaBookOpen,
    FaTrash,
    FaFire,
  } from 'react-icons/fa';

  import { HiOutlineCursorClick, HiPencil } from 'react-icons/hi';
  
  import {
    HiDocumentArrowDown,
    HiPaperAirplane,
  } from 'react-icons/hi2';
  
  // Main action icons
  export const IconRead = (props) => <FaEye className="text-lg" {...props} />;
  export const IconBookOpen = (props) => <FaBookOpen className="text-lg" {...props} />;
  export const IconEPUB = (props) => <HiDocumentArrowDown className="text-lg" {...props} />;
  export const IconKindle = (props) => <FaFire className="text-lg" {...props} />;
  export const IconShare = (props) => <HiPaperAirplane className="text-lg" {...props} />;
  export const IconTrash = (props) => <FaTrash className="text-lg text-red-600" {...props} />;

  // Edit icon (pencil)
  export const IconEdit = (props) => <HiPencil className="text-lg" {...props} />;
  
  // Heart/Like icons
  export const IconHeart = (props) => <FaHeart className="text-lg text-red-600" {...props} />;
  export const IconHeartOutline = (props) => <FaRegHeart className="text-lg text-red-600" {...props} />;
  
  // Clickable icon
  export const IconClickable = (props) => (
    <HiOutlineCursorClick className="text-lg" {...props} />
  );
  