"use client";

import type { ComponentProps } from "react";

// <select> que envia o formulário ao trocar de opção: filtro e ordenação valem
// na hora, sem depender de achar o botão de buscar. Sem JavaScript continua um
// select comum, enviado pelo botão do formulário.
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      onChange={(event) => {
        props.onChange?.(event);
        event.currentTarget.form?.requestSubmit();
      }}
    />
  );
}
