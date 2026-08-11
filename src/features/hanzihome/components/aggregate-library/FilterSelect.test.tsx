import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { OptionSelectProps } from "@/components/ui/option-select";

const { mockOptionSelect } = vi.hoisted(() => ({
 mockOptionSelect: vi.fn<(props: OptionSelectProps) => void>(),
}));

vi.mock("@/components/ui/option-select", () => ({
 OptionSelect: (props: OptionSelectProps) => {
  mockOptionSelect(props);
  return <span />;
 },
}));

import { FilterSelect } from "./FilterSelect";

describe("FilterSelect", () => {
 it("maps the empty aggregate filter to a non-empty select item value", () => {
  const onChange = vi.fn<(value: string) => void>();

  renderToStaticMarkup(
   <FilterSelect
    label="Course"
    value=""
    options={[{ value: "course-1", label: "Giáo trình 1" }]}
    onChange={onChange}
   />,
  );

  expect(mockOptionSelect).toHaveBeenCalledWith(
   expect.objectContaining({
    value: "__all__",
    options: [
     { value: "__all__", label: "Tất cả" },
     { value: "course-1", label: "Giáo trình 1" },
    ],
   }),
  );

  const optionSelectProps = mockOptionSelect.mock.calls[0]?.[0];
  if (!optionSelectProps) throw new Error("FilterSelect did not render OptionSelect.");

  optionSelectProps.onValueChange("__all__");
  expect(onChange).toHaveBeenCalledWith("");
 });
});
