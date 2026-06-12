export type Source = {
  id: string;
  name: string;
  feedUrl: string;
};

export const SOURCES: Source[] = [
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    id: "huggingface-blog",
    name: "Hugging Face Blog",
    feedUrl: "https://huggingface.co/blog/feed.xml",
  },
];
