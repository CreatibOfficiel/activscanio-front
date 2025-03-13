import { FC, ChangeEvent } from "react";

interface Props {
  label: string;
  hint: string;
  value: string;
  onChange: (val: string) => void;
}

const CustomTextInput: FC<Props> = ({ label, hint, value, onChange }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex flex-col mb-4">
      <label className="text-neutral-300 text-heading mb-2">{label}</label>
      <input
        type="text"
        placeholder={hint}
        value={value}
        onChange={handleChange}
        className="bg-neutral-800 text-neutral-300 text-regular rounded border border-neutral-750 px-4 py-2"
      />
    </div>
  );
};

export default CustomTextInput;
