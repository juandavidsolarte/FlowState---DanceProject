import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import TextInput from "./TextInput";

const PasswordInput = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextInput
        {...props}
        type={visible ? "text" : "password"}
        icon={Lock}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/50 transition hover:bg-white/8 hover:text-white"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
};

export default PasswordInput;