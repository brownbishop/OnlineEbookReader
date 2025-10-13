import {Rendition} from 'epubjs';
import {useEffect, useRef, useState} from 'react';
import {ReactReader} from 'react-reader';
import {useSearchParams} from 'react-router';

function Reader() {
    const [searchParams, _setSearchParams] = useSearchParams();
    const [page, setPage] = useState('');
    const [location, setLocation] = useState<string | number>(0);
    const rendition = useRef<Rendition | undefined>(undefined);
    const toc = useRef<any[]>([]);

    const url: string = searchParams.get('url') || "";
    const title: string = searchParams.get('title') || "";


    useEffect(() => console.log(location), [location]);
    return (<>
        <div className="absolute top-0 right-0 z-10 text-black">
            <h3>{page}</h3>
        </div>

        <div className="relative w-screen h-screen" >
            <ReactReader
                url={url}
                title={title}
                location={location}
                tocChanged={(l) => toc.current = l}
                showToc={true}
                pageTurnOnScroll={true}
                locationChanged={(loc: string) => {
                    setLocation(loc)
                    if (rendition.current && toc.current) {
                        const {displayed, href} = rendition.current.location.start
                        const chapter = toc.current.find((item) => item.href === href)
                        setPage(
                            `Page ${displayed.page} of ${displayed.total} in chapter ${chapter ? chapter.label : 'n/a'
                            }`
                        )
                    }
                }}
                getRendition={(r: Rendition) => {
                    rendition.current = r
                }}

            />
        </div>
    </>
    )
}



export default Reader
