import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract equipnet.com', async function() {
  const matrix = standardMatrix();
  const expected = [
    {
      auctionName: 'Ilumina NextSeq 1000 Next Generation Sequencer NGS',
      location: 'Vancouver, WA USA',
      category: 'Sequencer',
    },
    {
      auctionName: 'Beckman Coulter Optima XPN-80 Laboratory Ultracentrifuge',
      location: 'Vancouver, WA USA',
      category: 'Laboratory Centrifuge',
    },
    {
      auctionName: 'Thermo Scientific KingFisher Apex Purification System - Need To Be Repaired',
      location: 'Vancouver, WA USA',
      category: 'Nucleic Acid Extractor',
    },
    {
      auctionName: 'Unused Molgen PurePrep 96 Nucleic Acid Purification System',
      location: 'Bellevue, WA USA',
      category: 'Nucleic Acid Extractor',
    },
    {
      auctionName: 'Qiagen QIAstat-Dx Analyzers Multiplex Molecular Diagnostic System',
      location: 'Germantown,MD USA',
      category: 'Analyzer',
    },
    {
      auctionName: 'Leica Peloris II Rapid Tissue Processor',
      location: 'Frederick,MD USA',
      category: 'Tissue Processor',
    },
    {
      auctionName: 'Millipore Mobius Flexready Smart System with 100 Liter Single Use Reactor',
      location: 'Seekonk, MA USA',
      category: 'Reactor',
    },
    {
      auctionName: 'ATR Biotech Infors HT Multitron Pro Double Stacked Incubator',
      location: 'Seekonk, MA USA',
      category: 'Incubator',
    },
    {
      auctionName: 'Fresenius LOVO 6R4900 Benchtop Cell Processing System',
      location: 'Seekonk, MA USA',
      category: 'Processor',
    },
    {
      auctionName: 'Advanced Instruments Osmotech Pro Multi-Sample Micro-Osmometer',
      location: 'Seekonk, MA USA',
      category: 'Osmometer',
    },
    {
      auctionName: 'Quadro Fitzpatrick Scalable Lab System Granulator',
      location: 'Seekonk, MA USA',
      category: 'Granulator',
    },
    {
      auctionName: 'Agilent Technologies 6120 Quadrupole LC/MS With 1200 Infinity HPLC',
      location: 'Seekonk, MA USA',
      category: 'Mass Spectrometer',
    },
    {
      auctionName: 'Unused Molgen PurePrep 96 Nucleic Acid Purification System',
      location: 'Bellevue, WA USA',
      category: 'Nucleic Acid Extractor',
    },
    {
      auctionName: 'Unused Molgen PurePrep 96 Nucleic Acid Purification System',
      location: 'Bellevue, WA USA',
      category: 'Nucleic Acid Extractor',
    },
    {
      auctionName: 'Unused Molgen PurePrep 96 Nucleic Acid Purification System',
      location: 'Bellevue, WA USA',
      category: 'Nucleic Acid Extractor',
    },
    {
      auctionName: 'Unused Molgen PurePrep 96 Nucleic Acid Purification System',
      location: 'Bellevue, WA USA',
      category: 'Nucleic Acid Extractor',
    },
    {
      auctionName: 'Steris AMSCO 250LS Single Door Steam Sterilizer with Integrated Steam Generator',
      location: 'middletown,RI USA',
      category: 'Sterilizer',
    },
    {
      auctionName: 'Hamamatsu C9600-02 NanoZoomer Digital Pathology Scanner With L11600-05 Spot Light Source',
      location: 'Seekonk, MA USA',
      category: 'Scanner',
    },
    {
      auctionName: 'Agilent Technologies 7200 Series Q-TOF Mass Spectrometer',
      location: 'Des Moines,IA USA',
      category: 'Mass Spectrometer',
    },
    {
      auctionName: 'Beckman Coulter Optima XPN-80 Laboratory Ultracentrifuge',
      location: 'Vancouver, WA USA',
      category: 'Laboratory Centrifuge',
    },
    {
      auctionName: 'Beckman Coulter Avanti JXN-26 High Speed Centrifuge',
      location: 'Vancouver, WA USA',
      category: 'Laboratory Centrifuge',
    },
    {
      auctionName: 'Beckman Coulter Avanti JXN-26 High Speed Centrifuge',
      location: 'Vancouver, WA USA',
      category: 'Laboratory Centrifuge',
    },
    {
      auctionName: 'Beckman Coulter Optima XPN-80 Laboratory Ultracentrifuge',
      location: 'Vancouver, WA USA',
      category: 'Laboratory Centrifuge',
    },
    {
      auctionName: 'Thermo Scientific KingFisher Apex Purification System - Need To Be Repaired',
      location: 'Vancouver, WA USA',
      category: 'Nucleic Acid Extractor',
    },
    {
      auctionName: 'BioRad QX ONE Droplet Digital PCR System - Need To Be Repaired',
      location: 'Vancouver, WA USA',
      category: 'Photometric Analyzer',
    },
    {
      auctionName: 'Lot Of Thermo Scientific 4353 MaxQ 6000 Double Stacked Incubated Refrigerated Shaker',
      location: 'Seekonk, MA USA',
      category: 'Shaker',
    },
    {
      auctionName: 'Waters Acquity UPLC System',
      location: 'Seekonk, MA USA',
      category: 'UPLC',
    },
    {
      auctionName: 'GE Healthcare AxiChrom 450/300 Chromatography Column',
      location: 'Seekonk, MA USA',
      category: 'Chromatography Column',
    },
    {
      auctionName: 'Cepheid GeneXpert Portable PCR System Xpress 2 Modules',
      location: 'Boston, MA USA',
      category: 'PCR and Thermal Cycler',
    },
    {
      auctionName: 'Cepheid GeneXpert 4-Module PCR System',
      location: 'Boston, MA USA',
      category: 'PCR and Thermal Cycler',
    },
    {
      auctionName: 'Lot Of Beckman Centrifuge FA Rotors, Swing Bucket Rotors, Tubes, Adapters And Microplate Buckets',
      location: 'Seekonk, MA USA',
      category: 'Laboratory Centrifuge',
    },
    {
      auctionName: 'Nexus XPeel Microplate Handler/Stacker',
      location: 'Seekonk, MA USA',
      category: 'Microplate Handler/Stacker',
    },
    {
      auctionName: 'Brooks Life Science Systems XPeel Plate Seal Remover',
      location: 'Seekonk, MA USA',
      category: 'Microplate',
    },
    {
      auctionName: 'Brooks Life Science Systems XPeel Plate Seal Remover',
      location: 'Seekonk, MA USA',
      category: 'Microplate',
    },
    {
      auctionName: 'Brooks Life Science Systems XPeel Plate Seal Remover',
      location: 'Seekonk, MA USA',
      category: 'Microplate',
    },
    {
      auctionName: 'Zeiss Axio Vert.A1 FL LED Inverted Photo Microscope - Need To Be Repaired',
      location: 'Vancouver, WA USA',
      category: 'Microscope',
    },
    {
      auctionName: 'Hamilton Microlab Nimbus Liquid Handler',
      location: 'Guelph, CAN',
      category: 'Liquid Handler',
    },
    {
      auctionName: 'Hamilton Microlab Nimbus Liquid Handler',
      location: 'Guelph, CAN',
      category: 'Liquid Handler',
    },
    {
      auctionName: 'Applied Biosystems Quantstudio 6 Pro Real-time PCR System',
      location: 'Vancouver, WA USA',
      category: 'PCR and Thermal Cycler',
    },
    {
      auctionName: 'Precision NanoSystems Inc NanoAssemblr BT Microfluidics Mixing System',
      location: 'Seekonk, MA USA',
      category: 'Synthesizer',
    },
    {
      auctionName: 'Eppendorf 5810 R Refrigerated Centrifuge',
      location: 'Seekonk, MA USA',
      category: 'Laboratory Centrifuge',
    },
    {
      auctionName: 'Waters Micromass Quattro Premier XE Tandem Quadrupole Mass Spectrometer',
      location: 'Seekonk, MA USA',
      category: 'Mass Spectrometer',
    },
    {
      auctionName: 'Binder KB 720-UL Incubator',
      location: 'Seekonk, MA USA',
      category: 'Incubator',
    },
    {
      auctionName: 'Beckman Coulter DxH 520 Closed Vial Hematology Analyzer',
      location: 'Seekonk, MA USA',
      category: 'Blood Cell Analyzer',
    },
    {
      auctionName: 'Agilent Technologies 01867-201 PlateLoc Thermal Microplate Heat Sealer',
      location: 'Seekonk, MA USA',
      category: 'Heat Sealer',
    },
    {
      auctionName: 'Thermo Scientific TSX50086A Ultra-Low Freezers',
      location: 'Vancouver, WA USA',
      category: 'Freezer',
    },
    {
      auctionName: 'Labconco Corporation Cell Logic Plus Biological Safety Cabinet',
      location: 'Seekonk, MA USA',
      category: 'Biological Safety Cabinet',
    },
    {
      auctionName: 'Analytik Jena UVP ChemStudio Plus Imaging System',
      location: 'Vancouver, WA USA',
      category: 'Imager',
    },
    {
      auctionName: 'The Baker Company SG 603A-HE SterilGARD Biological Safety Cabinet With Stand',
      location: 'Seekonk, MA USA',
      category: 'Biological Safety Cabinet',
    },
    {
      auctionName: 'The Baker Company SG 603A-HE SterilGARD Biological Safety Cabinet With Stand',
      location: 'Seekonk, MA USA',
      category: 'Biological Safety Cabinet',
    }
  ];

  const cases = [
    // {
    //   name: 'live',
    //   url: 'https://www.equipnet.com/auctions/catalog/march-lab/1476/',
    //   expected,
    // },
    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/71ebnlfnpo/https-www-equipnet-com-auctions-catalog-march-lab-1476-.html',
      expected,
    },
  ];

  const questions = {
    auctionName: 'What the name of the auction',
    location: 'What is the location',
    category: 'what is the category',
    url: 'what is the auction url',
  }

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions,
        mode: 'multiple',
        view: 'html',
      })
      .limit(50)
      .plan();

    await itRunMatrix(
      it,
      `extract equipnet.com (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected),
      ],
      { shouldSave: true });
  }
});
