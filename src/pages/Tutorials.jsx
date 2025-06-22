import React, { useState, useEffect } from 'react';
import { Tutorial } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';

export default function Tutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    setLoading(true);
    try {
      const data = await Tutorial.list();
      setTutorials(data);
    } catch (error) {
      console.error("Error loading tutorials:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <PlayCircle className="w-8 h-8 text-blue-500" />
        <h1 className="text-2xl font-bold text-white">Tutoriais</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, j) => (
            <Card key={j} className="bg-[#1a1d27] border-0 animate-pulse">
              <div className="aspect-video bg-gray-700/50 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700/50 rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : tutorials.length === 0 ? (
         <Card className="bg-[#1a1d27] border-0 text-center">
            <div className="p-10">
                <PlayCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Nenhum Tutorial Disponível</h3>
                <p className="text-gray-400">Ainda não há tutoriais para exibir. Volte em breve!</p>
            </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tutorials.map(tutorial => (
            <Card key={tutorial.id} className="bg-[#1a1d27] border-0 flex flex-col overflow-hidden">
              <div className="aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={tutorial.video_url}
                  title={tutorial.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <CardHeader>
                <CardTitle className="text-base font-medium text-white">{tutorial.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-400">{tutorial.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}