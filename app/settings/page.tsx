import { createClient } from "@/resource/supabase";

export default async function Settings() {
  const supabase = await createClient();
  const result = await supabase.from("lists").select();

  console.log("result");
  console.log(result);

  const { data: lists } = result;

  return (
    <>
      <h1>Settings</h1>
      <pre>{JSON.stringify(lists, null, 2)}</pre>
    </>
  );
}
