interface AlertProps {
  variant: "danger" | "warning" | "info" | "success";
  title: string;
  body: string;
  cite?: string;
}

export const Alert = ({ variant, title, body, cite }: AlertProps) => (
  <div className={`aegis-alert ${variant}`} role="alert">
    <div className="aegis-alert-title">{title}</div>
    <div className="aegis-alert-body">{body}</div>
    {cite && <div className="aegis-alert-cite">{cite}</div>}
  </div>
);
