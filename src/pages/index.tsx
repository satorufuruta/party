import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/quiz",
    permanent: false,
  },
});

export default function RedirectToQuiz() {
  return null;
}
