"use client"

import { PRODUCT_LABELS } from "@/lib/products"
import type { InsuranceProduct } from "@/lib/products"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { POLICY_FORM } from "@/lib/constants"

interface ProductPickerProps {
  value: InsuranceProduct | ""
  onChange: (value: InsuranceProduct) => void
}

const PRODUCTS = Object.keys(PRODUCT_LABELS) as InsuranceProduct[]

export function ProductPicker({ value, onChange }: ProductPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="product-picker">{POLICY_FORM.productLabel}</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as InsuranceProduct)}
      >
        <SelectTrigger id="product-picker" className="w-full">
          <SelectValue placeholder={POLICY_FORM.productPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {PRODUCTS.map((product) => (
            <SelectItem key={product} value={product}>
              {PRODUCT_LABELS[product]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
