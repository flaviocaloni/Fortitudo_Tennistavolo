"use client";

import { useState } from "react";
import FitetDataModal from "./fitet-data-modal";

interface Team {
  id: string;
  name: string;
  series: string;
  group_code: string;
}

const FITET_MAPPINGS: Record<string, { calendarioCAM: number; classificaCAM: number }> = {
  "D1_A": { calendarioCAM: 414, classificaCAM: 414 },
  "D2_D": { calendarioCAM: 425, classificaCAM: 425 },
  "D2_J": { calendarioCAM: 431, classificaCAM: 431 },
  "D3_MI_D": { calendarioCAM: 444, classificaCAM: 444 },
  "D3_MI_F": { calendarioCAM: 446, classificaCAM: 446 },
};

function getSeriesKey(series: string, groupCode: string): string {
  const key = `${series}_${groupCode}`.toUpperCase();
  return key;
}

function getFitetUrls(series: string, groupCode: string) {
  const key = getSeriesKey(series, groupCode);
  const mapping = FITET_MAPPINGS[key];

  if (!mapping) return null;

  return {
    calendario: `https://portale.fitet.org/risultati/campionati/Calendario.asp?CAM=${mapping.calendarioCAM}&ANNO=41`,
    classifica: `https://portale.fitet.org/risultati/campionati/classifica_squadre.php?CAM=${mapping.classificaCAM}`,
  };
}

export default function FitetLinksTable({ teams }: { teams: Team[] }) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  const handleOpenModal = (url: string, title: string) => {
    setSelectedUrl(url);
    setModalTitle(title);
  };

  const handleCloseModal = () => {
    setSelectedUrl(null);
    setModalTitle("");
  };

  if (!teams || teams.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Squadre - Link Classifica e Risultati FITET
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Squadra
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Serie
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Girone
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const fitetUrls = getFitetUrls(team.series, team.group_code);
                return (
                  <tr key={team.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {team.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {team.series}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {team.group_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      {fitetUrls ? (
                        <>
                          <button
                            onClick={() =>
                              handleOpenModal(
                                fitetUrls.classifica,
                                `${team.name} - Classifica FITET`
                              )
                            }
                            className="text-blue-600 hover:underline"
                          >
                            📊 Classifica
                          </button>
                          <button
                            onClick={() =>
                              handleOpenModal(
                                fitetUrls.calendario,
                                `${team.name} - Risultati FITET`
                              )
                            }
                            className="text-green-600 hover:underline"
                          >
                            📅 Risultati
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Serie non mappata
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUrl && (
        <FitetDataModal
          url={selectedUrl}
          title={modalTitle}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
