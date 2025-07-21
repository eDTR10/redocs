import { Input } from '../ui/input'

function InputText2({type,label,onChange,value}:any) {
  return (
    <div className=' w-full flex flex-col gap-2 sm:gap-2'>
        <p className=' col-span-1 text-foreground text-sm '>{label}</p>
       <Input className=' col-span-4 text-foreground outline-none' required value={value} type={type} onChange={onChange} placeholder={label} />
    </div>
  )
}

export default InputText2