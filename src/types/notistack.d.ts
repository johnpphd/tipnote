import "notistack";

declare module "notistack" {
  interface VariantOverrides {
    alert: {
      type?: "error" | "success" | "warning";
      title?: string;
    };
  }
}
